import { useNavigate } from '@umijs/max';
import { Button } from 'antd';
const BackButton = (name) => {
    const navigate = useNavigate();
    return (<Button type="default" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
      {name}
    </Button>);
};
export default BackButton;
//# sourceMappingURL=back_button.jsx.map