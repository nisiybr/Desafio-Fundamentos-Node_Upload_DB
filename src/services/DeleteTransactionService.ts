import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

interface RequestDTO {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: RequestDTO): Promise<void> {
    const transaction = getRepository(Transaction);

    const transactionExists = await transaction.findOne(id);

    if (!transactionExists) {
      throw new AppError('Transaction informed does not exists!', 400);
    }

    await transaction.delete(id);
  }
}

export default DeleteTransactionService;
