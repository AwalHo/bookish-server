/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type reviews = {
  email: string;
  description: string;
  rating: string;
};

export type IBook = {
  title: string;
  author: string;
  thumbnail: string;
  price: string;
  rating: string;
  featured: boolean;
  genre: string;
  publicationYear: string;
  reviews?: reviews[];
  addedBy: string;
  userPreference: string;
  addUserPreference(userId: string, status: string): Promise<void>;
  updateUserPreference(userId: string, newStatus: string): Promise<void>;
  removeUserPreference(userId: string): Promise<void>;
  status: string;
};

export type IbookFilters = {
  searchTerm?: string;
  genre?: string;
  publicationYear?: string;
};

export type BookModel = Model<IBook, Record<string, unknown>>;
