import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { bookFilterableFields } from './book.constant';
import { bookService } from './book.service';

const addBook = catchAsync(async (req: Request, res: Response) => {
  const book = req.body;

  const result = await bookService.addBook(book);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Book added successfully',
    data: result,
  });
});

const getAllBooks = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, bookFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  console.log(filters, 'che', paginationOptions);

  const result = await bookService.getAllBooks(filters, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All books',
    data: result,
  });
});

const getBooksByStatus = catchAsync(async (req: Request, res: Response) => { 
  const status = req.params.status;
  const result = await bookService.getBooksByStatus(status as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `All books with status ${status} retrieved successfully`,
    data: result,
  });

});

const removeUserPreference = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.body;
  const userId = req.user?._id; // Assuming you have middleware to get the authenticated user

  const result = await bookService.removeUserPreference(bookId, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User preference removed successfully',
    data: result,
  });
});

const getSingleBook = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await bookService.getSingleBook(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved single book',
    data: result,
  });
});

const addReview = catchAsync(async (req: Request, res: Response) => {
  const result = await bookService.addReview(req);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review added successfully',
    data: result,
  });
});

const editBook = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const data = req.body;
  console.log(data, 'cheki', bookId);

  const result = await bookService.editBook(bookId, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book updated successfully',
    data: result,
  });
});

const deleteBook = catchAsync(async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const result = await bookService.deleteBook(bookId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Book deleted successfully',
    data: result,
  });
});

const addUserPreference = catchAsync(async (req: Request, res: Response) => {
  const result = await bookService.addUserPreference(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User preference added successfully',
    data: result,
  });
});

// const updateUserPreference = catchAsync(async (req: Request, res: Response) => {
//   const { bookId } = req.params;
//   const { status } = req.body;
//   const userId = req.user._id; // Assuming you have middleware to get the authenticated user

//   const result = await bookService.updateUserPreference(bookId, userId, status);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'User preference updated successfully',
//     data: result,
//   });
// });

export const BookController = {
  addBook,
  getAllBooks,
  getSingleBook,
  addReview,
  editBook,
  deleteBook,
  addUserPreference,
  removeUserPreference,
  getBooksByStatus
};
