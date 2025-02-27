declare module 'lodash' {
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
    }
  ): T;

  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
    }
  ): T;

  export function cloneDeep<T>(value: T): T;
  
  export function isEqual(value: any, other: any): boolean;
  
  export function merge<TObject, TSource>(object: TObject, source: TSource): TObject & TSource;
}