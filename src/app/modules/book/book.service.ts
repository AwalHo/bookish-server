import { Request } from 'express';
import httpStatus from 'http-status';
import { SortOrder } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { bookSearchableFields } from './book.constant';
import { IBook, IbookFilters } from './book.interface';
import { Book } from './book.model';

const addBook = async (data: IBook) => {
  try {
    const result = await Book.create(data);

    return result;
  } catch (err) {
    console.log(err, 'err');

    throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
  }
};

const addUserPreference = async (req: Request) => {
  const { bookId, status } = req.body;
  const user = req.user;
  const book = await Book.findById(bookId).populate('userPreference');
  if (!book) {
    throw new Error('Book not found');
  }

  console.log(book, 'result');
  const result = await book.addUserPreference(user?._id, status);

  return result;
};

const getAllBooks = async (
  filters: IbookFilters,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<IBook[]>> => {
  const { searchTerm, ...filtersData } = filters;

  const { limit, skip, page, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];

  // search needs $or condition for search in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: bookSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  // dynamic sort needs fild to do sorting on

  const sortCondition: { [key: string]: SortOrder } = {};

  if (sortBy && sortOrder) {
    sortCondition[sortBy] = sortOrder;
  }

  const whereCondition =
    andConditions.length > 0 ? { $and: andConditions } : {};
  console.log(sortCondition, 'checking ');

  const result = await Book.find(whereCondition)
    .sort(sortCondition)
    .skip(skip)
    .limit(limit);

  const total = await Book.countDocuments();

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleBook = async (id: string) => {
  const book = await Book.findById(id).populate('reviews._id');

  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found');
  }

  return book;
};

const addReview = async (req: Request) => {
  const { bookId } = req.params;
  const user = req.user;
  const { description, rating } = req.body;

  const book = await Book.findById(bookId);

  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found');
  }
  const email = user?.email;

  book?.reviews?.push({ email, description, rating });

  await book.save();

  return book;
};

const editBook = async (id: string, data: IBook) => {
  console.log(id, data);

  const book = await Book.findByIdAndUpdate(id, data, { new: true });

  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found');
  }

  return book;
};

const deleteBook = async (id: string) => {
  const book = await Book.findByIdAndDelete(id);

  if (!book) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Book not found');
  }

  return book;
};

export const bookService = {
  addBook,
  getAllBooks,
  getSingleBook,
  addReview,
  editBook,
  deleteBook,
  addUserPreference,
};
