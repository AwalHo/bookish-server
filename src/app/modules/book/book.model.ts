/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { BookModel, IBook } from './book.interface';

type Preference = {
  user: Schema.Types.ObjectId;
  status: string;
};

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
      maxlength: 4500,
    },
    summary: {
      type: String,
      maxlength: 2500,
    },
    author: {
      type: String,
    },
    genre: {
      type: [String],
    },
    publicationYear: {
      type: Date,
    },
    thumbnail: {
      type: String,
    },
    avgRating: {
      type: String,
      default: '0',
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        description: {
          type: String,
        },
        rating: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
    addedBy: {
      type: String,
      ref: 'User',
    },
    userPreference: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
        status: { type: String, enum: ['read', 'reading', 'finished'] },
        updatedAt: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ['trendy', 'recommended', 'popular', 'regular', 'latest'],
      default: 'regular',
    },
  },
  {
    timestamps: true,
  }
);

BookSchema.methods.addUserPreference = async function (
  userId: string,
  status: string
) {
  try {
    console.log(this.userPreference, 'exit', userId, status);
    const existingPreference = this.userPreference.find(
      (pref: Preference) =>
        pref.user && pref.user.toString() === userId.toString()
    );

    if (existingPreference) {
      existingPreference.status = status;
      existingPreference.updatedAt = new Date();
    } else {
      this.userPreference.push({
        user: userId,
        status,
        updatedAt: new Date(),
      });
    }

    const updatedBook = await this.save();
    return updatedBook;
  } catch (err) {
    console.error(err);
    throw new ApiError(400, 'User preference not added');
  }
};

BookSchema.methods.removeUserPreference = async function (userId: string) {
  this.userPreference = this.userPreference.filter(
    (pref: Preference) => pref.user.toString() !== userId.toString()
  );
  await this.save();
};

export const Book = model<IBook, BookModel>('Book', BookSchema);
