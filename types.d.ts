import { passwords } from "@/db/models/schema";
interface TabBarIconProps {
  focused: boolean;
  label?: string;
  icon: React.ReactNode;
}

export interface PasswordFormProps {
  value: Partial<PasswordInsertType>;
  onChange: (data: Partial<PasswordInsertType>) => void;
  onSubmit: () => void;
}

type FieldNameForm<T> = Extract<keyof T, string>;

export type FieldName<TExtraFields extends Record<string, unknown> = {}> =
  FieldNameForm<PasswordInsertType>;

export type PasswordInsertType = typeof passwords.$inferInsert;
