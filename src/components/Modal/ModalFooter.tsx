import { FC, PropsWithChildren } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ModalFooterProps extends PropsWithChildren {
  className?: string;
}

const ModalFooter: FC<ModalFooterProps> = (props: ModalFooterProps) => {
  const { children, className } = props;
  return (
    <div
      className={`bg-neutral-800 text-iit-dark-gray dark:text-white border-t border-iit-light-gray dark:border-gray-600 ${className}`}
    >
      {children}
    </div>
  );
};

ModalFooter.displayName = 'ModalFooter';

export default ModalFooter;
