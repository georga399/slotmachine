import "./blank.scss";

interface BlankProps {
  text: string;
}

export const Blank = ({ text }: BlankProps) => {
  return <div className="blank">{text}</div>;
};
