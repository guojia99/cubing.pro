import { useNavigate } from '@umijs/max';
import { Button } from 'antd';

const BackButton: (name: string) => JSX.Element = (name: string) => {
  const navigate = useNavigate();

  return (
    <Button type="default" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
      {name}
    </Button>
  );
};

export function c() {
  const navigate = useNavigate();
  navigate(-1);
}

export default BackButton;
