import { Request } from 'express';
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { ILoginUserResponse, IUser } from './user.interface';
import { User } from './user.model';

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

const userPreference = async (req: Request) => {
  const user = req.user;
  console.log(req.body, 'req.body');

  const { bookId, preference } = req.body;
  const existingUser = await User.findOne({ email: user?.email });
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }

  const preferences = await User.findByIdAndUpdate(
    existingUser._id,
    {
      $push: {
        userPrefernce: {
          book: bookId,
          status: preference,
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

const removeFromReadingList = async (
  user: JwtPayload | null,
  bookId: string
) => {
  // want to remove the product id in the wishlist

  const existingUser = await User.findOne({ email: user?.email });
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }

  const bookObjectId = new Types.ObjectId(bookId);

  existingUser.readingList = existingUser.readingList?.filter(
    id => !new Types.ObjectId(id).equals(bookObjectId)
  );

  await existingUser.save();
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

const getFinishedBooks = async (user: JwtPayload | null) => {
  //get the reading list product
  const existingUser = await User.findOne({ email: user?.email }).populate(
    'finishedBooks'
  );
  return existingUser;
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
  getFinishedBooks,
  getWishList,
  getReadingList,
  removeFromReadingList,
};
