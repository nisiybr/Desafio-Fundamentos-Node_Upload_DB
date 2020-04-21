// import AppError from '../errors/AppError';
import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface RequestDTO {
  categoryName: string;
}

class CreateCategoryService {
  public async execute({ categoryName }: RequestDTO): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const categoryExists = await categoryRepository.findOne({
      where: { title: categoryName },
    });
    if (!categoryExists) {
      const category = categoryRepository.create({
        title: categoryName,
      });

      await categoryRepository.save(category);

      return category;
    }
    return categoryExists;
  }
}

export default CreateCategoryService;
