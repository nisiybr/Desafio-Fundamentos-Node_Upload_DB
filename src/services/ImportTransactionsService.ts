import path from 'path';
import fs from 'fs';
import csv from 'csv-parse';
import { getRepository, In, Not } from 'typeorm';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVtransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface RequestDTO {
  sheetFilename: string;
}

class ImportTransactionsService {
  async execute({ sheetFilename }: RequestDTO): Promise<Transaction[]> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    const transactions: CSVtransaction[] = [];
    const categories: string[] = [];

    const filePath = path.join(uploadConfig.directory, sheetFilename);

    const transactionsReadStream = fs.createReadStream(filePath);

    const parsers = csv({
      from_line: 2,
    });
    const parseCSV = transactionsReadStream.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (item: Category) => item.title,
    );

    const addCategoriesTitles = categories
      .filter(category => {
        return !existentCategoriesTitles.includes(category);
      })
      .filter((item, index, self) => self.indexOf(item) === index);

    const newCategories = categoryRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );
    // Categorias Criadas
    await categoryRepository.save(newCategories);

    // Todas as categorias da base que existem no csv
    const allCategories = [...existentCategories, ...newCategories];

    // Montando objeto para gravacao
    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    // Salvando Objeto
    await transactionRepository.save(createdTransactions);

    // excluindo arquivo
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
