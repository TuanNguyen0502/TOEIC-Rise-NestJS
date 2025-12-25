export class PageResponse<T> {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: T[]; // Spring Boot dùng tên là "result", không phải "content"

  constructor(data: T[], page: number, size: number, total: number) {
    this.meta = {
      page: page,
      pageSize: size,
      pages: Math.ceil(total / size),
      total: total,
    };
    this.result = data;
  }
}
