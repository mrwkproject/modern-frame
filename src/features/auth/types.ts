export type FieldErrors = Record<string, string[] | undefined>;

export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: FieldErrors;
};

export const initialFormState: FormState = { status: 'idle' };
