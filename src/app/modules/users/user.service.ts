/* eslint-disable @typescript-eslint/consistent-type-definitions */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { ILoginUserResponse, IUser, UserPref } from './user.interface';
import { User } from './user.model';

interface User extends Document {
  userPrefernce: UserPref[];
  save: () => Promise<void>;
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

  const preferences = await User.findByIdAndUpdate(
    existingUser._id,
    {
      $push: {
        userPrefernce: {
          book: bookId,
          status,
          updated: new Date(),
        },
      },
    },
    {
      new: true,
    }
  );
  console.log(preferences, 'preferences');
  return preferences;
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
  // want to remove the product id in the wishlist
  console.log(bookId,'chekcing di')
  const existingUser = (await User.findOne({ email: user?.email })) as User;
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }

  const bookObjectId = new Types.ObjectId(bookId);

  existingUser.userPrefernce = existingUser.userPrefernce?.filter(
    pref => !new Types.ObjectId(pref.book).equals(bookObjectId)
  );

  const result = await existingUser.save();

  console.log(result, 'checking');
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
