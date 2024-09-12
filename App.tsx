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
  TextInput,
  TouchableOpacity,
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
  createCategory,
  createFlow,
  createTables,
  getCategories,
  getFlows,
  getFlowTypes,
  getTableNames,
  seedTables,
} from './database/database';
import {
  AutocompleteDropdown,
  AutocompleteDropdownContextProvider,
} from 'react-native-autocomplete-dropdown';

import Icon from 'react-native-vector-icons/AntDesign';

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
  const [searchCategoriesText, setSearchCategoriesText] = useState<String>('');

  const [selectedCategory, setSelectedCategory] = useState({});
  const [cashAmount, setCashAmount] = useState(0);
  const [selectedFlowType, setSelectedFlowType] = useState({});

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

  const addCategory = async title => {
    const db = await connectToDatabase();

    await createCategory(db, title);

    refresh();
  };

  const addFlow = async () => {
    const db = await connectToDatabase();

    await createFlow(
      db,
      cashAmount,
      selectedCategory.title,
      selectedFlowType.id,
    );

    clearFlowInput();

    refresh();
  };

  const clearFlowInput = () => {
    setSelectedCategory(0);
    setSelectedFlowType(0);
    setCashAmount(0);
  };

  const refresh = async () => {
    const db = await connectToDatabase();

    setFlowTypes(await getFlowTypes(db));
    setFlowCategories(await getCategories(db));
    setFlows(await getFlows(db));
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <AutocompleteDropdownContextProvider>
      <SafeAreaView style={[backgroundStyle, {minHeight: '50%'}]}>
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
                    {flow.flowtype} - {flow.category} - {flow.sum}€
                  </Text>
                </View>
              ))}
          </View>
        </ScrollView>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            position: 'absolute',
            bottom: 0,
          }}>
          <AutocompleteDropdown
            style={{width: '50%'}}
            clearOnFocus={false}
            closeOnBlur={true}
            closeOnSubmit={false}
            onSelectItem={setSelectedFlowType}
            dataSet={flowTypes}
            textInputProps={{
              autoCorrect: false,
              autoCapitalize: 'none',
              style: {
                borderRadius: 25,
                backgroundColor: '#383b42',
                color: '#fff',
                paddingLeft: 18,
              },
            }}
            initialValue={{id: '2'}} // or just '2'
            rightButtonsContainerStyle={{
              right: 8,
              height: 30,

              alignSelf: 'center',
            }}
            inputContainerStyle={{
              backgroundColor: '#383b42',
              borderRadius: 25,
            }}
            suggestionsListContainerStyle={{
              backgroundColor: '#383b42',
            }}
            containerStyle={{flexGrow: 2, flexShrink: 1}}
            renderItem={(item, text) => (
              <Text style={{color: '#fff', padding: 15}}>{item.title}</Text>
            )}
            inputHeight={50}
            EmptyResultComponent={
              <TouchableOpacity
                style={{}}
                onPress={() => addCategory(searchCategoriesText)}>
                <Text style={{color: 'white', height: 20, margin: 5}}>
                  Add "{searchCategoriesText}"?
                </Text>
              </TouchableOpacity>
            }
          />
          <AutocompleteDropdown
            style={{width: '50%'}}
            clearOnFocus={false}
            closeOnBlur={true}
            closeOnSubmit={false}
            onChangeText={setSearchCategoriesText}
            onSelectItem={setSelectedCategory}
            dataSet={flowCategories}
            textInputProps={{
              autoCorrect: false,
              autoCapitalize: 'none',
              style: {
                borderRadius: 25,
                backgroundColor: '#383b42',
                color: '#fff',
                paddingLeft: 18,
              },
            }}
            initialValue={{id: '2'}} // or just '2'
            rightButtonsContainerStyle={{
              right: 8,
              height: 30,

              alignSelf: 'center',
            }}
            inputContainerStyle={{
              backgroundColor: '#383b42',
              borderRadius: 25,
            }}
            suggestionsListContainerStyle={{
              backgroundColor: '#383b42',
            }}
            containerStyle={{flexGrow: 2, flexShrink: 1}}
            renderItem={(item, text) => (
              <Text style={{color: '#fff', padding: 15}}>{item.title}</Text>
            )}
            inputHeight={50}
            EmptyResultComponent={
              <TouchableOpacity
                style={{}}
                onPress={() => addCategory(searchCategoriesText)}>
                <Text style={{color: 'white', height: 20, margin: 5}}>
                  Add "{searchCategoriesText}"?
                </Text>
              </TouchableOpacity>
            }
          />
          <TextInput
            style={{flexGrow: 1}}
            onChangeText={setCashAmount}
            value={cashAmount}
            placeholder="amount"
            keyboardType="numeric"
          />
          <TouchableOpacity style={{flexGrow: 1}} onPress={() => addFlow()}>
            <Icon name="plus" size={25} color={'black'}></Icon>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AutocompleteDropdownContextProvider>
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
