import { folders, passwords } from "@/db/schema";
import { PasswordFormErrors } from "@/lib/validation/password";

export type { PasswordFormErrors };

interface TabBarIconProps {
  focused: boolean;
  label?: string;
  icon: React.ReactNode;
}

export type TagType = { id: string | null; name: string };

export type PasswordFormValue = Omit<
  Partial<PasswordInsertType>,
  "expiryDays"
> & {
  password?: string;
  folderName?: string;
  tags?: TagType[];
  expiryDays?: string;
};

export interface PasswordFormProps {
  value: PasswordFormValue;
  onChange: (
    data: PasswordFormValue | ((prev: PasswordFormValue) => PasswordFormValue),
  ) => void;
  onSubmit: (value: PasswordFormValue) => void;
  errors?: PasswordFormErrors;
}

type FieldNameForm<T> = Extract<keyof T, string>;

export type FieldName<TExtraFields extends Record<string, unknown> = {}> =
  FieldNameForm<PasswordFormValue>;

export type PasswordInsertType = typeof passwords.$inferInsert;
export type FolderInserType = typeof folders.$inferInsert;
