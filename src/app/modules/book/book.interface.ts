/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type reviews = {
  userId: string;
  description: string;
  rating: string;
};

export type UserPref = {
  user: string;
  status: string;
  updatedAt: Date;
};

export type IBook = {
  title: string;
  description: string;
  summary: string;
  author: string;
  thumbnail: string;
  price: string;
  rating: string;
  featured: boolean;
  genre: [string];
  publicationYear: Date;
  reviews?: reviews[];
  addedBy: string;
  userPreference: string;
  addUserPreference(
    userId: string,
    status: string,
    updatedAt?: Date
  ): Promise<void>;
  updateUserPreference(userId: string, newStatus: string): Promise<void>;
  removeUserPreference(userId: string): Promise<void>;
  status: string;
  avgRating: string;
  ratingCount: number;
};

export type IbookFilters = {
  searchTerm?: string;
  genre?: string;
  publicationYear?: string;
  status?: string;
};

export type BookModel = Model<IBook, Record<string, unknown>>;
