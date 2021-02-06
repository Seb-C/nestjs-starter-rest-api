import { Test, TestingModule } from '@nestjs/testing';

import { ROLE } from '../../auth/constants/role.constant';
import { UserAccessTokenClaims } from '../../auth/dtos/auth-token-output.dto';
import { UserOutput } from '../../user/dtos/user-output.dto';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import {
  CreateArticleInput,
  UpdateArticleInput,
} from '../dtos/article-input.dto';
import { ArticleRepository } from '../repositories/article.repository';
import { ArticleService } from './article.service';

describe('ArticleService', () => {
  let service: ArticleService;

  const mockedRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    getById: jest.fn(),
  };

  const mockedUserService = {
    getUserById: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: ArticleRepository, useValue: mockedRepository },
        { provide: UserService, useValue: mockedUserService },
      ],
    }).compile();

    service = moduleRef.get<ArticleService>(ArticleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Create Article', () => {
    it('should get user from user claims user id', () => {
      const userClaims: UserAccessTokenClaims = {
        id: 1,
        roles: [ROLE.USER],
        username: 'testuser',
      };

      service.createArticle(userClaims, new CreateArticleInput());
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
    });

    it('should call repository save with proper article input and return proper output', async () => {
      const userClaims: UserAccessTokenClaims = {
        id: 1,
        roles: [ROLE.USER],
        username: 'testuser',
      };

      const articleInput: CreateArticleInput = {
        title: 'Test',
        post: 'Hello, world!',
      };

      const author = new UserOutput();
      mockedUserService.getUserById.mockResolvedValue(author);
      const expected = {
        title: 'Test',
        post: 'Hello, world!',
        author,
      };

      const expectedOutput = {
        id: 1,
        title: 'Test',
        post: 'Hello, world!',
        author: new User(),
      };
      mockedRepository.save.mockResolvedValue(expectedOutput);

      const output = await service.createArticle(userClaims, articleInput);
      expect(mockedRepository.save).toHaveBeenCalledWith(expected);
      expect(output).toEqual(expectedOutput);
    });
  });

  describe('Update Article', () => {
    it('should get article by id', () => {
      const userClaims: UserAccessTokenClaims = {
        id: 1,
        roles: [ROLE.USER],
        username: 'testuser',
      };
      const articleId = 1;
      const input: UpdateArticleInput = {
        title: 'New Title',
        post: 'New Post',
      };

      service.updateArticle(userClaims, articleId, input);
      expect(mockedRepository.getById).toHaveBeenCalledWith(articleId);
    });

    it('should save article with updated title and post', async () => {
      const userClaims: UserAccessTokenClaims = {
        id: 1,
        roles: [ROLE.USER],
        username: 'testuser',
      };
      const articleId = 1;
      const input: UpdateArticleInput = {
        title: 'New Title',
        post: 'New Post',
      };
      const author = new User();
      author.id = 1;

      mockedRepository.getById.mockResolvedValue({
        id: 1,
        title: 'Old title',
        post: 'Old post',
        author,
      });

      const expected = {
        id: 1,
        title: 'New Title',
        post: 'New Post',
        author,
      };
      await service.updateArticle(userClaims, articleId, input);
      expect(mockedRepository.save).toHaveBeenCalledWith(expected);
    });
  });
});
