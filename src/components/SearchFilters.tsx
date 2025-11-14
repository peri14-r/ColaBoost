import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  searchTerm: string;
  niche: string;
  followerRange: string;
  sortBy: string;
  tags: string[];
}

const followerRanges = [
  { value: 'all', label: 'All Followers' },
  { value: 'micro', label: '≤1,000 followers' },
  { value: 'mid', label: '1,000 - 10,000 followers' },
  { value: 'macro', label: '>10,000 followers' }
];

const sortOptions = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'followers_desc', label: 'Most Followers' },
  { value: 'followers_asc', label: 'Least Followers' },
  { value: 'recent', label: 'Recently Joined' }
];

const popularNiches = [
  'Content Creation', 'Photography', 'Fashion', 'Tech', 'Gaming', 
  'Beauty', 'Fitness', 'Travel', 'Food', 'Music', 'Art', 'Business'
];

export function SearchFilters({ onFiltersChange, className }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    niche: '',
    followerRange: 'all',
    sortBy: 'relevant',
    tags: []
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFilters({ tags: filters.tags.filter(tag => tag !== tagToRemove) });
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      niche: '',
      followerRange: 'all',
      sortBy: 'relevant',
      tags: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Filters
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Term */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Creators</Label>
          <Input
            id="search"
            placeholder="Search by name, bio, or skills..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          />
        </div>

        {/* Follower Range */}
        <div className="space-y-2">
          <Label>Follower Count</Label>
          <Select value={filters.followerRange} onValueChange={(value) => updateFilters({ followerRange: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {followerRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </Button>

          {showAdvanced && (
            <>
              {/* Niche Selection */}
              <div className="space-y-2">
                <Label>Niche</Label>
                <Select value={filters.niche} onValueChange={(value) => updateFilters({ niche: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Niches</SelectItem>
                    {popularNiches.map(niche => (
                      <SelectItem key={niche} value={niche}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Popular Tags */}
              <div className="space-y-2">
                <Label>Popular Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {popularNiches.slice(0, 6).map(tag => (
                    <Badge 
                      key={tag} 
                      variant={filters.tags.includes(tag) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => filters.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Selected Tags */}
              {filters.tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map(tag => (
                      <Badge key={tag} variant="default" className="cursor-pointer">
                        {tag}
                        <X 
                          className="ml-1 h-3 w-3" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}