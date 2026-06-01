import LoginForm from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';
import { render } from '@/lib/test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn().mockResolvedValue(true),
      user: null,
      isAuthenticated: false,
    } as any);
  });

  it('should render the login form correctly', () => {
    render(<LoginForm onSwitch={() => {}} />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should allow user to type in email and password fields', () => {
    render(<LoginForm onSwitch={() => {}} />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should call login from useAuth when form is submitted', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true);
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
    } as any);

    render(<LoginForm onSwitch={() => {}} />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should handle signIn errors gracefully', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
    } as any);

    render(<LoginForm onSwitch={() => {}} />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should have a forgot password link', () => {
    render(<LoginForm onSwitch={() => {}} />);
    const forgotLink = screen.getByRole('link', { name: /Forgot it/i });

    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });
});
