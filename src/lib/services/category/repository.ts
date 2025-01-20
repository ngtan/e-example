// src/lib/services/category/repository.ts
export class CategoryRepository extends BaseRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cache: CacheManager,
    private readonly config: ConfigManager
  ) {
    super();
  }

  async findById(id: string): Promise<Category | null> {
    return this.httpClient.get<Category>(
      `/categories/${id}`,
      {
        cache: {
          key: `category:${id}`,
          ttl: this.config.get('category.cacheTTL', 3600000)
        }
      }
    );
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.httpClient.get<Category>(
      `/categories/slug/${slug}`,
      {
        cache: {
          key: `category:slug:${slug}`,
          ttl: this.config.get('category.cacheTTL', 3600000)
        }
      }
    );
  }

  async search(query: CategoryQuery): Promise<SearchResult<Category>> {
    return this.httpClient.get<SearchResult<Category>>(
      '/categories',
      {
        params: this.buildSearchParams(query),
        cache: {
          key: `categories:${this.buildCacheKey(query)}`,
          ttl: this.config.get('category.listCacheTTL', 1800000)
        }
      }
    );
  }

  async getTree(query?: CategoryQuery): Promise<Category[]> {
    return this.httpClient.get<Category[]>(
      '/categories/tree',
      {
        params: this.buildSearchParams(query),
        cache: {
          key: `categories:tree:${this.buildCacheKey(query)}`,
          ttl: this.config.get('category.treeCacheTTL', 3600000)
        }
      }
    );
  }

  async create(input: CategoryCreateInput): Promise<Category> {
    const category = await this.httpClient.post<Category>(
      '/categories',
      input
    );

    await this.invalidateTreeCache();
    return category;
  }

  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    const category = await this.httpClient.patch<Category>(
      `/categories/${id}`,
      input,
      {
        headers: {
          'If-Match': input.version
        }
      }
    );

    await this.invalidateRelatedCaches(id);
    return category;
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/categories/${id}`);
    await this.invalidateRelatedCaches(id);
  }

  private async invalidateTreeCache(): Promise<void> {
    await this.cache.deleteByPattern('categories:tree:*');
  }

  private async invalidateRelatedCaches(categoryId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(`category:${categoryId}`),
      this.cache.deleteByPattern(`category:slug:*`),
      this.cache.deleteByPattern('categories:tree:*'),
      this.cache.deleteByPattern('categories:*')
    ]);
  }

  private buildSearchParams(query: CategoryQuery): Record<string, any> {
    return {
      parentId: query.parentId,
      includeInactive: query.includeInactive,
      includeChildren: query.includeChildren,
      level: query.level,
      sort: query.sort,
      page: query.page,
      limit: query.limit
    };
  }

  private buildCacheKey(query: CategoryQuery): string {
    return JSON.stringify({
      parentId: query.parentId,
      includeInactive: query.includeInactive,
      includeChildren: query.includeChildren,
      level: query.level,
      sort: query.sort,
      page: query.page,
      limit: query.limit
    });
  }
}
