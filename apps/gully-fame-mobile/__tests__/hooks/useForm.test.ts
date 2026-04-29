// Created by Kiro
// useForm Hook Tests

import { renderHook, act } from '@testing-library/react-native';
import { useForm } from '../../src/hooks/useForm';

describe('useForm Hook', () => {
  const initialValues = {
    email: '',
    password: '',
    name: '',
  };

  const validationRules = {
    email: [
      (value: string) => {
        if (!value) return 'Email is required';
        if (!value.includes('@')) return 'Invalid email';
        return null;
      },
    ],
    password: [
      (value: string) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
    ],
    name: [
      (value: string) => {
        if (!value) return 'Name is required';
        return null;
      },
    ],
  };

  it('should initialize form with initial values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    expect(result.current.formState.email.value).toBe('');
    expect(result.current.formState.password.value).toBe('');
    expect(result.current.formState.name.value).toBe('');
  });

  it('should handle field change', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.formState.email.value).toBe('test@example.com');
  });

  it('should validate field on blur', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.formState.email.error).toBe('Email is required');
    expect(result.current.formState.email.touched).toBe(true);
  });

  it('should validate entire form', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    let isValid = false;
    await act(async () => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.resetForm();
    });

    expect(result.current.formState.email.value).toBe('');
  });

  it('should set field value', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.setFieldValue('email', 'new@example.com');
    });

    expect(result.current.formState.email.value).toBe('new@example.com');
  });

  it('should set field error', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.setFieldError('email', 'Custom error');
    });

    expect(result.current.formState.email.error).toBe('Custom error');
  });

  it('should get field props', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    const props = result.current.getFieldProps('email');

    expect(props).toHaveProperty('value');
    expect(props).toHaveProperty('onChangeText');
    expect(props).toHaveProperty('onBlur');
  });

  it('should get form values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
    });

    const values = result.current.getValues();

    expect(values.email).toBe('test@example.com');
    expect(values.password).toBe('password123');
  });

  it('should check if form is valid', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
      result.current.handleChange('name', 'John Doe');
    });

    expect(result.current.isValid()).toBe(true);
  });

  it('should check if form is dirty', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, validationRules })
    );

    expect(result.current.isDirty()).toBe(false);

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.isDirty()).toBe(true);
  });

  it('should handle form submission', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useForm({
        initialValues,
        validationRules,
        onSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
      result.current.handleChange('name', 'John Doe');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalled();
  });
});
