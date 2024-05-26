import { CSSProperties } from "react";
import { useSpring,animated, } from "react-spring";

export default class SpringTool {
  static AnimatedComponent = (props: {
    children: React.ReactNode,
    spring?: any,
    style?: CSSProperties,
  },) => {
    const { children, spring, style } = props;

    return <animated.div style={{
      ...(style ? style : {}),
      ...(!!spring && useSpring(spring)),
    }}>
      {children}
    </animated.div>
  }
}