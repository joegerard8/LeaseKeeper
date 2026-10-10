// Kept out of any "use server" file: server action modules may only export
// async functions, so shared state types live here instead.
export type ActionState = {
  error: string | null;
};

export const initialActionState: ActionState = { error: null };

export type PortalAccountState = {
  error: string | null;
  email: string | null;
  tempPassword: string | null;
};

export const initialPortalAccountState: PortalAccountState = {
  error: null,
  email: null,
  tempPassword: null,
};
