import { Request, RequestHandler, Response } from 'express';
import config from '../../../config';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ILoginUserResponse } from './user.interface';
import { User } from './user.model';
import { UserService } from './user.service';

const createUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userData = req.body;
    console.log(userData, 'userData');

    const result = await UserService.createUser(userData);
    // const { refreshToken, ...others } = result;

    // set refresh token into cookie
    const cookieOptions = {
      secure: config.env === 'production',
      httpOnly: true,
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User logged in successfully !',
      data: result,
    });
  }
);

const loginUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userData = req.body;
    console.log(userData, 'userData');

    const result = await UserService.loginUser(userData);
    // const { others } = result;

    // set refresh token into cookie
    const cookieOptions = {
      secure: config.env === 'production',
      httpOnly: true,
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User logged in successfully !',
      data: result,
    });
  }
);

// const userPreference = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user;
//   console.log(req.body, 'req.body');

//   const { bookId, status } = req.body;

//   const data = {
//     userId: user?._id,
//     bookId,
//     status,
//   };

//   const result = await UserService.userPreference({ data });

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Added to UserPrefer!',
//     data: result,
//   });
// });

const getWishList = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getWishList(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gett the wishlist !',
    data: result,
  });
});

const readingList = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.body;
  const user = req.user;
  const result = await UserService.readingList(user, bookId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Added to Readinglist !',
    data: result,
  });
});

const getReadingList = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getReadingList(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'get the Readin list !',
    data: result,
  });
});

const getUserPreferences = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.body;
  const user = req.user;
  console.log(bookId, 'bookId finished book');
  const result = await UserService.getUserPreferences(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User preferences fetched!',
    data: result,
  });
});

const removeUserPreference = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const user = req.user;
  console.log(bookId, 'bookId finished book');
  const result = await UserService.removeUserPreference(user, bookId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User preferences removed!',
    data: result,
  });
});

const getFinishedBooks = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserPreferences(user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Added to wishlist !',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await UserService.refreshToken(refreshToken);

  // set refresh token into cookie

  sendResponse<ILoginUserResponse>(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully !',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const id = req.user?._id;
  console.log(id, 'check');

  const user = await User.findById(id).lean();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile !',
    data: user,
  });
});

export const UserController = {
  createUser,
  loginUser,
  refreshToken,
  getMe,
  readingList,
  getUserPreferences,
  getFinishedBooks,
  getWishList,
  getReadingList,
  removeUserPreference,
};
