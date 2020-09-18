import * as React from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";

interface Props {
  children: React.ReactElement<any>;
  style?: StyleProp<ViewStyle>;
  endPaddingHeight?: number;
  duration?: number;
  delay?: number;
}

const AutoScrolling = ({
  style,
  children,
  endPaddingHeight = 10,
  duration,
  delay = 0,
}: Props) => {
  const containerHeight = React.useRef(0);
  const contentHeight = React.useRef(0);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(false);
  const [dividerHeight, setDividerHeight] = React.useState(endPaddingHeight);
  const offsetY = React.useRef(new Animated.Value(0));
  let contentRef: any;

  function measureContainerView(event: LayoutChangeEvent) {
    const newContainerHeight = event.nativeEvent.layout.height;
    if (containerHeight.current === newContainerHeight) return;
    containerHeight.current = newContainerHeight;
    if (!contentRef) return;
    contentRef.measure(
      (fx: number, fy: number, width: number, height: number) => {
        checkContent(height, fy);
      }
    );
  }

  function checkContent(newContentHeight: number, fy: number) {
    if (!newContentHeight) {
      setIsAutoScrolling(false);
      return;
    }
    if (contentHeight.current === newContentHeight) return;
    contentHeight.current = newContentHeight;
    let newDividerHeight = endPaddingHeight;
    if (contentHeight.current < containerHeight.current) {
      if (endPaddingHeight < containerHeight.current - contentHeight.current) {
        newDividerHeight = containerHeight.current - contentHeight.current;
      }
    }
    setDividerHeight(newDividerHeight);
    setIsAutoScrolling(true);
    Animated.loop(
      Animated.timing(offsetY.current, {
        toValue: -contentHeight.current + fy + newDividerHeight,
        duration: duration || 50 * contentHeight.current,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }

  function measureContentView(event: LayoutChangeEvent) {
    const { height, y } = event.nativeEvent.layout;
    if (!containerHeight.current || height === contentHeight.current) return;
    offsetY.current.stopAnimation();
    offsetY.current.setValue(0);
    offsetY.current.setOffset(0);
    checkContent(height, y);
  }

  const childrenProps = children.props;
  const childrenWithProps = React.cloneElement(children, {
    ...childrenProps,
    onLayout: measureContentView,
    ref: (ref: any) => (contentRef = ref),
  });

  return (
    <View onLayout={measureContainerView} style={style}>
      <ScrollView
        horizontal={true}
        bounces={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        <Animated.View
          style={{
            flexDirection: "row",
            transform: [{ translateY: offsetY.current }],
          }}
        >
          {childrenWithProps}
          {isAutoScrolling && <View style={{ height: dividerHeight }} />}
          {isAutoScrolling && children}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default React.memo(AutoScrolling);
