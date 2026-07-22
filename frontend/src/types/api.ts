export interface IApiResponse<T = unknown> {
  code: number;
  message: string;
  result: T;
}

export interface IPageResponse<T> {
  content: T[];
  pageNumber?: number;
  pageSize?: number;
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first?: boolean;
  size?: number;
  number?: number;
}
