import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/lib/test-utils';
import LoginForm from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';
import { signIn } from 'next-auth/react';

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form correctly', () => {
    const { container } = render(<LoginForm onSwitch={() => {}} />);
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('should allow user to type in email and password fields', () => {
    const { container } = render(<LoginForm onSwitch={() => {}} />);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should call login from useAuth when form is submitted', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true);
    (useAuth as any) = vi.fn().mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false
    });

    const { container } = render(<LoginForm onSwitch={() => {}} />);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
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
    (useAuth as any) = vi.fn().mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false
    });

    const { container } = render(<LoginForm onSwitch={() => {}} />);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      // Look for the error message shown in the UI
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });
  
  it('should allow Google sign in', () => {
    render(<LoginForm onSwitch={() => {}} />);
    const googleButton = screen.getByRole('button', { name: /Google/i });
    
    fireEvent.click(googleButton);
    expect(signIn).toHaveBeenCalledWith('google', expect.objectContaining({ callbackUrl: '/dashboard' }));
  });
});
