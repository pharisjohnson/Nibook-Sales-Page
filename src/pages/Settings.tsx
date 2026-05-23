import React, { useState, useEffect } from 'react';
import { settingsTable, insertSettingsSchema } from '../../lib/db/src/schema/settings';
import { z } from 'zod/v4';

const SettingsPage = () => {
  const [settings, setSettings] = useState<ReturnType<typeof settingsTable.$inferSelect>>({} as ReturnType<typeof settingsTable.$inferSelect>);
  const [formData, setFormData] = useState<Record<string, any>>({} as Record<string, any>);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from authentication context (cookies/localStorage)
  useEffect(() => {
    const storedUserId = window.localStorage.getItem('userId') || window.cookieName?.userId;
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const result = await fetch(`/api/settings`);
        const data = await result.json();
        setSettings(data);
        setFormData(data);
        if (!userId && data.userId) {
          setUserId(data.userId);
        }
      } catch (err) {
        setError('Failed to load settings');
      }
    }
    fetchSettings();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};

    // Validate required fields
    if (!formData.userId) {
      errors.userId = 'User ID is required';
    }
    if (!formData.storageBucket) {
      errors.storageBucket = 'Storage bucket is required';
    }
    if (!formData.apiKey) {
      errors.apiKey = 'API key is required';
    }

    // Validate API key format (example):
    const apiKeyPattern = /^[a-zA-Z0-9]{8,32}$/;
    if (!apiKeyPattern.test(formData.apiKey!)) {
      errors.apiKey = 'API key must be 8-32 alphanumeric characters';
    }

    // Validate max file size (example):
    if (formData.maxFileSize && (formData.maxFileSize < 1 || formData.maxFileSize > 100)) {
      errors.maxFileSize = 'Max file size must be between 1MB and 100MB';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join('
'));
      setSuccess(false);
      return;
    }

    try {
      const validated = insertSettingsSchema.parse(formData);

      await fetch(`/api/settings`, {
        method: 'PUT',
        body: JSON.stringify({ ...validated, userId: userId || formData.userId }), 
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess(true);
      setError(null);
      setFormData({} as Record<string, any>); // Reset form
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      setSuccess(false);
    }
  };

  return (
    <div>
      {error && <div className="error">${error}</div>}
      {success && <div className="success" style="margin-top: 15px;">Settings saved successfully!</div>}
      <form onSubmit={handleSubmit}>
        <label>
          User ID (Read-only)
          <input
            type="text"
            name="userId"
            value="{userId || formData.userId}"
            onChange={handleChange}
            disabled
          />
        </label>

        <label>
          Storage Bucket
          <input
            type="text"
            name="storageBucket"
            value="{formData.storageBucket}"
            onChange={handleChange}
            required
          />
          {errors.storageBucket && <span className="error" style="color: red; margin-left: 5px;">${errors.storageBucket}</span>}
        </label>

        <label>
          API Key
          <input
            type="password"
            name="apiKey"
            value="{formData.apiKey}"
            onChange={handleChange}
            required
          />
          {errors.apiKey && <span className="error" style="color: red; margin-left: 5px;">${errors.apiKey}</span>}
        </label>

        <label>
          Theme
          <input
            type="text"
            name="theme"
            value="{formData.theme}"
            onChange={handleChange}
          />
        </label>

        <label>
          Notification Email
          <input
            type="checkbox"
            name="notificationEmail"
            checked="{formData.notificationEmail}"
            onChange={handleChange}
          />
        </label>

        <label>
          Timezone
          <input
            type="text"
            name="timezone"
            value="{formData.timezone}"
            onChange={handleChange}
          />
        </label>

        <label>
          Max File Size (MB)
          <input
            type="number"
            name="maxFileSize"
            value="{formData.maxFileSize}"
            onChange={handleChange}
            required
          />
          {errors.maxFileSize && <span className="error" style="color: red; margin-left: 5px;">${errors.maxFileSize}</span>}
        </label>

        <label>
          Analytics Enabled
          <input
            type="checkbox"
            name="analyticsEnabled"
            checked="{formData.analyticsEnabled}"
            onChange={handleChange}
          />
        </label>

        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
};


export default SettingsPage;