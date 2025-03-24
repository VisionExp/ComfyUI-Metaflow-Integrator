import { FC, PropsWithChildren } from 'react';

// eslint-disable-next-line
export interface ModalBodyProps extends PropsWithChildren {}

const ModalBody: FC<ModalBodyProps> = (props) => {
  const { children } = props;
  return (
    <div className="bg-neutral-800 text-white h-full max-h-[60vh] overflow-y-auto">
      {children}
    </div>
  );
};

ModalBody.displayName = 'ModalBody';

export default ModalBody;
