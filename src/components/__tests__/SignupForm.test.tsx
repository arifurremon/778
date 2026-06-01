import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { render } from '@/lib/test-utils';
import SignupForm from '@/components/auth/signup-form';
import { useAuth } from '@/hooks/use-auth';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

describe('SignupForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signup: vi.fn().mockResolvedValue(true),
      user: null,
      isAuthenticated: false,
    } as any);
  });

  it('should render the signup form fields', () => {
    const { container } = render(<SignupForm onSwitch={() => {}} />);

    expect(container.querySelector('#email')).toBeInTheDocument();
    expect(container.querySelector('#username')).toBeInTheDocument();
    expect(container.querySelector('#password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('should allow typing in fields', () => {
    const { container } = render(<SignupForm onSwitch={() => {}} />);

    const emailInput = container.querySelector('#email') as HTMLInputElement;
    const usernameInput = container.querySelector('#username') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(usernameInput.value).toBe('testuser');
  });

  it('should display validation errors if submitted empty', async () => {
    const { container } = render(<SignupForm onSwitch={() => {}} />);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      const errors = container.querySelectorAll('.text-red-600');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('should not call signup when required fields are missing', async () => {
    const mockSignup = vi.fn().mockResolvedValue(true);
    vi.mocked(useAuth).mockReturnValue({
      signup: mockSignup,
      user: null,
      isAuthenticated: false,
    } as any);

    render(<SignupForm onSwitch={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockSignup).not.toHaveBeenCalled();
    });
  });
});
