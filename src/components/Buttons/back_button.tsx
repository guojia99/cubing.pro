import {Button} from "antd";
import {useNavigate} from "@umijs/max";

const BackButton: (name: string) => JSX.Element = (name: string) => {
  const navigate = useNavigate();

  return (
    <Button type="default" onClick={() => navigate(-1)} style={{marginBottom:"20px"}}>
      {name}
    </Button>
  );
};

export default BackButton;
