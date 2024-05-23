import { Router } from 'express';
import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BookController } from './book.controller';
import { bookValidation } from './book.validation';

const router = Router();

router.post(
  '/add',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  validateRequest(bookValidation.bookZodSchema),
  BookController.addBook
);
router.get('/all', BookController.getAllBooks);
router.get('/:id', BookController.getSingleBook);

router.patch(
  '/review/:bookId',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  BookController.addReview
);

router.patch(
  '/:bookId',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  BookController.editBook
);
router.delete(
  '/:bookId',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  BookController.deleteBook
);
router.post(
  '/preference',
  auth(ENUM_USER_ROLE.USER),
  BookController.addUserPreference
);

router.get('/new/:status', BookController.getBooksByStatus);
router.patch("/remove/preference", auth(ENUM_USER_ROLE.USER), BookController.removeUserPreference);

export const BookRoutes = router;
