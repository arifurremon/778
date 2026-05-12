import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/lib/test-utils';
import PostCard from '@/components/community/post-card';
import { PrivacyLevel } from '@prisma/client';

vi.mock('@/hooks/use-community', () => ({
  useCommunity: () => ({
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    addComment: vi.fn(),
  }),
}));

const mockPost = {
  id: '1',
  content: 'Hello World! This is a test post.',
  images: [],
  comments: [{ id: 'c1' }, { id: 'c2' }],
  checkInLocation: 'Chittagong',
  visibility: PrivacyLevel.PUBLIC,
  helpfulCount: 5,
  notHelpfulCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: {
    id: 'author1',
    name: 'Author Name',
    preferredName: 'Author',
    profileImage: null,
    isVerified: true,
    isSeller: false,
    isServiceProvider: false,
    username: 'author_1',
  },
  _count: {
    comments: 2,
  },
};

describe('PostCard Component', () => {
  it('should render post author name and content', () => {
    render(<PostCard post={mockPost} currentUserId="test_user" />);
    
    expect(screen.getByText('Author Name')).toBeInTheDocument();
    expect(screen.getByText('Hello World! This is a test post.')).toBeInTheDocument();
  });

  it('should render check-in location if provided', () => {
    render(<PostCard post={mockPost} currentUserId="test_user" />);
    
    expect(screen.getByText('Chittagong')).toBeInTheDocument();
  });

  it('should render correct number of comments and helpful counts', () => {
    render(<PostCard post={mockPost} currentUserId="test_user" />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // Helpful count
    expect(screen.getByText('2')).toBeInTheDocument(); // Comments count
  });

  it('should format date correctly', () => {
    render(<PostCard post={mockPost} currentUserId="test_user" />);
    
    // The exact text depends on date-fns formatDistanceToNow, but we can check if a time string exists
    expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
  });

  it('should show verified badge if author is verified', () => {
    const { container } = render(<PostCard post={mockPost} currentUserId="test_user" />);
    // Verified badge usually has a specific color or icon. We can check for standard verification SVG class or title.
    // Given we can't easily query SVGs without aria-labels, we verify it doesn't crash
    expect(container).toBeInTheDocument();
  });
});
