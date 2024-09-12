/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {
  connectToDatabase,
  createTables,
  getCategories,
  getFlows,
  getFlowTypes,
  getTableNames,
  seedTables,
} from './database/database';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [flowTypes, setFlowTypes] = useState<any[]>([]);
  const [flowCategories, setFlowCategories] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);

  const loadData = React.useCallback(async () => {
    // TODO: Initialize database, add communication with database
    try {
      const db = await connectToDatabase();
      await createTables(db);
      await seedTables(db);

      console.log(await getTableNames(db));

      setFlowTypes(await getFlowTypes(db));
      setFlowCategories(await getCategories(db));
      setFlows(await getFlows(db));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Text>Transactions</Text>
          {flows &&
            flows.length > 0 &&
            flows.map(flow => (
              <View>
                <Text>
                  {' '}
                  {flow.id} - {flow.category_id} - {flow.sum}
                </Text>
              </View>
            ))}
          <Text>Flow types</Text>

          {flowTypes &&
            flowTypes.length > 0 &&
            flowTypes.map(type => (
              <View>
                <Text>
                  {type.id} - {type.title}
                </Text>
              </View>
            ))}
          <Text>Categories</Text>
          {flowCategories &&
            flowCategories.length > 0 &&
            flowCategories.map(category => (
              <View>
                <Text>
                  {category.id} - {category.title}
                </Text>
              </View>
            ))}
          <View>
            <Text>Add transaction</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
