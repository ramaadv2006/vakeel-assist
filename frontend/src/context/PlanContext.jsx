import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

export const PREMIUM_FEATURES = {
  BAIL_APP: 'draft.bail_app',
  SURETYSHIP_APP: 'draft.suretyship_app',
  AI_ADVANCED: 'ai.advanced',
};

export function PlanProvider({ children }) {
  const { advocate } = useAuth();
  const [plan, setPlan] = useState({
    slug: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    billing_interval: 'month',
  });
  const [subscription, setSubscription] = useState(null);
  const [entitlements, setEntitlements] = useState(['draft.basic', 'ai.basic']);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);

  const refreshPlan = useCallback(async () => {
    if (!advocate) {
      setPlan({
        slug: 'free',
        name: 'Free',
        price: 0,
        currency: 'INR',
        billing_interval: 'month',
      });
      setSubscription(null);
      setEntitlements(['draft.basic', 'ai.basic']);
      setIsPro(false);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/payments/me');
      if (data) {
        setPlan(data.plan || { slug: 'free', name: 'Free', price: 0 });
        setSubscription(data.subscription || null);
        setEntitlements(data.entitlements || ['draft.basic', 'ai.basic']);
        setIsPro(Boolean(data.is_pro || (data.plan && data.plan.slug === 'pro')));
      }
    } catch (err) {
      console.warn('Failed to load plan summary from API:', err);
    } finally {
      setLoading(false);
    }
  }, [advocate]);

  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  const hasEntitlement = useCallback(
    (featureKey) => {
      if (!featureKey) return true;
      if (featureKey === 'draft.basic' || featureKey === 'ai.basic') return true;
      if (isPro) return true;
      return entitlements.includes(featureKey);
    },
    [isPro, entitlements]
  );

  const openUpgradeModal = useCallback((context = null) => {
    setModalContext(context);
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setModalContext(null);
  }, []);

  return (
    <PlanContext.Provider
      value={{
        plan,
        subscription,
        entitlements,
        isPro,
        loading,
        refreshPlan,
        hasEntitlement,
        upgradeModalOpen,
        modalContext,
        openUpgradeModal,
        closeUpgradeModal,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return ctx;
}
