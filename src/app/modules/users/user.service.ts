/* eslint-disable @typescript-eslint/consistent-type-definitions */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { Types, startSession } from 'mongoose';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { bookService } from '../book/book.service';
import { ILoginUserResponse, IUser, UserPref } from './user.interface';
import { User } from './user.model';

interface User extends Document {
  userPreference: UserPref[];
  save: () => Promise<void>;
  _id: string;
}

const createUser = async (user: IUser): Promise<ILoginUserResponse> => {
  const isUserExist = await User.isUserExist(user.email);
  if (isUserExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already exist');
  }

  const result = await User.create(user);

  //create access token & refresh token

  const { email, role, _id } = result;

  const accessToken = jwtHelpers.createToken(
    { email, role, _id },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { email, role, _id },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const loginUser = async (user: IUser): Promise<ILoginUserResponse> => {
  const isUserExist = await User.isUserExist(user.email);

  if (!isUserExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }

  if (
    isUserExist.password &&
    !(await User.isPasswordMatch(user.password, isUserExist.password))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  //create access token & refresh token

  const { email, role, _id } = isUserExist;

  console.log(isUserExist, 'isUserExist');

  const accessToken = jwtHelpers.createToken(
    { email, role, _id },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { email, role, _id },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const userPreference = async ({
  data,
}: {
  data: {
    userId: string;
    bookId: string;
    status: string;
  };
}) => {
  const { bookId, status, userId } = data;
  const existingUser = await User.findById({ _id: userId });
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }
console.log(existingUser, 'existingUser checking again');

  const existingPreference = existingUser?.userPrefernce?.find(pref => new Types.ObjectId(pref.book).toString() === bookId.toString());
  console.log(existingPreference, 'existingPreference checking');
  

  if(existingPreference){
    existingPreference.status = status;
    existingPreference.updatedAt = new Date();
  }else{
    existingUser?.userPrefernce?.push({
      book: bookId,
      status,
    updatedAt: new Date()
    })
  }
  const updatedUser = await existingUser.save();

  console.log(updatedUser, 'preferences');
  return updatedUser;
};

const getWishList = async (user: JwtPayload | null) => {
  //get the wishlist product
  const existingUser = await User.findOne({ email: user?.email }).populate(
    'wishlist'
  );

  return existingUser;
};

const readingList = async (user: JwtPayload | null, bookId: string) => {
  // want to push the product id in the reading list

  const existingUser = await User.findOne({ email: user?.email });
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }
  console.log(bookId, 'adding to readingList');

  existingUser.readingList?.push(bookId);
  await existingUser.save();
};

const getReadingList = async (user: JwtPayload | null) => {
  //get the reading list product
  const existingUser = await User.findOne({ email: user?.email }).populate(
    'readingList'
  );

  return existingUser;
};


const removeUserPreference = async (
  user: JwtPayload | null,
  bookId: string
) => {
  const session = await startSession();
  session.startTransaction();
  try {
    const existingUser = (await User.findOne({ email: user?.email }))
    if (!existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
    }
    const bookObjectId = new Types.ObjectId(bookId);
    const existingBookPreference = existingUser?.userPrefernce?.find(
      (preference) => preference.book.toString() === bookObjectId.toString()
    );
      console.log(existingBookPreference, 'existingBookPreference');
      
    if (!existingBookPreference) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Book not found in user preference');
    }

    existingUser.userPrefernce = existingUser?.userPrefernce?.filter(
      (pref) => pref.book.toString() !== bookObjectId.toString() );
    const result = await existingUser.save();
    console.log(result, 'checking result');

    // remove user id from the book user preference
     await bookService.removeUserPreference(bookId, existingUser._id);
    // console.log(book, 'book FROM THE USER');
    


    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // rethrow the error
  }
};

const finishedBooks = async (user: JwtPayload | null, bookId: string) => {
  // want to push the product id in the reading list

  const existingUser = await User.findOne({ email: user?.email });
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }
  existingUser.finishedBooks?.push(bookId);
  await existingUser.save();
};

const getUserPreferences = async (user: JwtPayload | null) => {
  //get the reading list product
  const result = await User.findOne({ email: user?.email }).populate({
    path: 'userPrefernce.book',
  });
  return result?.userPrefernce;
};

const refreshToken = async (token: string): Promise<ILoginUserResponse> => {
  //verify token
  // invalid token - synchronous
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as Secret
    );
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid Refresh Token');
  }

  const { email } = verifiedToken;

  // tumi delete hye gso  kintu tumar refresh token ase
  // checking deleted user's refresh token

  const isUserExist = await User.isUserExist(email);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }
  //generate new token

  const newAccessToken = jwtHelpers.createToken(
    {
      email: isUserExist.email,
      role: isUserExist.role,
    },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken: newAccessToken,
  };
};

export const UserService = {
  createUser,
  loginUser,
  refreshToken,
  userPreference,
  readingList,
  finishedBooks,
  getUserPreferences,
  getWishList,
  getReadingList,
  removeUserPreference,
};
