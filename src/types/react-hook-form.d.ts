declare module "react-hook-form" {
  export function useForm<TFieldValues = any>(...args: any[]): any;
}

declare module "@hookform/resolvers/zod" {
  export const zodResolver: any;
}
