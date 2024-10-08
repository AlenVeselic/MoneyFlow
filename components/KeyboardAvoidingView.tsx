import {useEffect, useState} from 'react';
import {Keyboard, KeyboardAvoidingView} from 'react-native';

type KeyboardAvoidingViewProps = {
  behavior: 'height' | 'position' | 'padding' | undefined;
  children: any;
};

export const KeyboardAvoidingViewWithoutWhitespace = (
  props: KeyboardAvoidingViewProps,
) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setEnabled(true);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setEnabled(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={props.behavior}
      enabled={enabled}
      keyboardVerticalOffset={20}>
      {props.children}
    </KeyboardAvoidingView>
  );
};
