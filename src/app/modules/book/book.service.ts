import { Request } from 'express';
import httpStatus from 'http-status';
import mongoose, { SortOrder } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { UserService } from '../users/user.service';
import { bookSearchableFields } from './book.constant';
import { IBook, IbookFilters, UserPref } from './book.interface';
import { Book } from './book.model';

type Book = {
  userPreference: UserPref[];
  save: () => Promise<void>;
} & Document


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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookId, status } = req.body;
    const user = req.user;

    if (!user || !user._id) {
      throw new Error('User or user ID not found');
    }
    const book = await Book.findById(bookId).populate('userPreference');
    if (!book) {
      throw new Error('Book not found');
    }

    console.log(book, 'result', req.body, req.user);
    const result = await book.addUserPreference(user?._id, status);

    const data = {
      userId: user?._id,
      bookId,
      status,
    };
    // if(result.status){
    const saveUserPreference = await UserService.userPreference({ data });

    console.log(saveUserPreference);

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new ApiError(500, 'Something went wrong'); // rethrow the error
  }
};

const removeUserPreference = async (
  bookId: string,
  userId: string
) => {
  // want to remove the product id in the wishlist
  console.log(bookId,'chekcing di')
  const existingBook = await Book.findOne({
    _id: bookId,
  })
  if (!existingBook) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist');
  }

  const result = await Book.findOneAndUpdate({_id:bookId},{
    $pull:{
      userPreference:{
        user:userId
      }
    },
  })

  console.log(result,'result');
  

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
    
    Object.entries(filtersData).map(([key, value]) => {
      if (Array.isArray(value)) {
        andConditions.push({
          $or: value.map(val => ({
            [key]: val
          }))
        });
      } else {
        andConditions.push({
          [key]: value
        });
      }
    })
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

const getBooksByStatus = async (status: string) => {
  const books = await Book.find({ status });

  return books;
}


const getSingleBook = async (id: string) => {
  const book = await Book.findById(id).lean().populate({
    path: 'reviews.userId',
    model: 'User', // Specify the name of the User model
    select: 'name email', // Optionally, you can specify which fields to include
  });
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
  const userId = user && user?._id;

  book?.reviews?.push({ userId, description, rating });

  // increment the rating count
  book.ratingCount = book.ratingCount + 1;

  // calculate the avg rating
  const totalRating =
    book.reviews?.reduce((sum, review) => sum + Number(review.rating), 0) || 0;
  book.avgRating = (totalRating / book.ratingCount).toFixed(2);

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
  removeUserPreference,
  getBooksByStatus,
};
