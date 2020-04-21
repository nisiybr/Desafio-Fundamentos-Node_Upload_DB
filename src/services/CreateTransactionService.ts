import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import CreateCategoryService from './CreateCategoryService';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const createCategory = new CreateCategoryService();

    const { income } = await transactionRepository.getBalance();
    if (type === 'outcome' && value > income) {
      throw new AppError(
        'Value of outcome can not be higher than total income!',
      );
    }

    const { id } = await createCategory.execute({ categoryName });

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
