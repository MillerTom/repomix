import { input } from '@inquirer/prompts';

export const confirm = async (message: string): Promise<boolean> => {
  const answer = await input({
    message: `${message} (Y/n)`,
    default: 'Y',
    validate: (value) => {
      const v = value.toLowerCase();
      return v === 'y' || v === 'n' || v === 'yes' || v === 'no' || v === '';
    },
  });

  const normalized = answer.toLowerCase();
  return normalized === 'y' || normalized === 'yes' || normalized === '';
};
