'use client';

import { useState } from 'react';

import styles from '../app/page.module.css';

type FormValues = {
  description: string;
  deadline: string;
  amount: string;
};

export function CreateForm() {
  const [formValues, setFormValues] = useState<FormValues>({
    description: '',
    deadline: '',
    amount: '',
  });
  const minDate = new Date().toISOString().split('T')[0];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      description: formValues.description.trim(),
      deadline: formValues.deadline,
      amount: Number(formValues.amount),
    };

    console.log('Create commitment form submit:', payload);
    setFormValues({
      description: '',
      deadline: '',
      amount: '',
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          className={styles.input}
          value={formValues.description}
          onChange={handleChange}
          placeholder="Ej. Préstamo para curso"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="deadline" className={styles.label}>
          Deadline
        </label>
        <input
          id="deadline"
          name="deadline"
          type="date"
          className={styles.input}
          value={formValues.deadline}
          onChange={handleChange}
          min={minDate}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="amount" className={styles.label}>
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          className={styles.input}
          value={formValues.amount}
          onChange={handleChange}
          placeholder="0"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
        />
      </div>

      <button type="submit" className={styles.buttonPrimary}>
        Create Commitment
      </button>
    </form>
  );
}