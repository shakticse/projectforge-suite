import { NavigateFunction } from 'react-router-dom';

let navigate: NavigateFunction | null = null;

export const setNavigate = (fn: NavigateFunction) => {
  navigate = fn;
};

export const getNavigate = () => navigate;