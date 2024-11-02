import { useCallback } from 'react';
import { FluentIcon } from '@fluentui/react-icons';

export const useHoverableIcon = () => useCallback(
  (DefaultIcon: FluentIcon, HoverIcon: FluentIcon) => (
    <>
      <DefaultIcon className="icon default" />
      <HoverIcon className="icon hover" />
    </>
  ),
  []
);
