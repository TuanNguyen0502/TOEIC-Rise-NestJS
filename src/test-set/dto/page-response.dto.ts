export interface PageMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface PageResponse<T = any> {
  meta: PageMeta;
  result: T;
}
