/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
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
  getFlowsForToday,
  getFlowTypes,
  getTableNames,
  seedTables,
} from './database/database';
import {
  AutocompleteDropdown,
  AutocompleteDropdownContextProvider,
} from 'react-native-autocomplete-dropdown';

import Icon from 'react-native-vector-icons/AntDesign';
import {KeyboardAvoidingViewWithoutWhitespace} from './components/KeyboardAvoidingView';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [flowTypes, setFlowTypes] = useState<any[]>([]);
  const [flowCategories, setFlowCategories] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [todaysFlows, setTodaysFlows] = useState<any[]>([]);

  const [searchCategoriesText, setSearchCategoriesText] = useState<String>('');

  const [selectedCategory, setSelectedCategory] = useState({});
  const [cashAmount, setCashAmount] = useState('');
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
      setTodaysFlows(await getFlowsForToday(db));
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
    setTodaysFlows(await getFlowsForToday(db));
  };

  const backgroundStyle = {
    backgroundColor: 'black',
    height: (useWindowDimensions().height * 100) / 100,
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: (useWindowDimensions().height * 80) / 100,
            }}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}>
              <Text style={{marginTop: 5, fontSize: 20}}>
                Today's transactions
              </Text>
              {todaysFlows &&
                todaysFlows.length > 0 &&
                todaysFlows.map(flow => (
                  <View>
                    <Text style={{fontSize: 20}}>
                      {flow.category} | {flow.flowtype == 'income' ? '+' : ''}
                      {flow.flowtype == 'expense' ? '-' : ''}
                      {flow.sum}€
                    </Text>
                  </View>
                ))}
              <Text style={{fontSize: 20}}>
                Total &nbsp;
                {todaysFlows
                  .reduce((prev, flow) => prev + parseFloat(flow.sum), 0)
                  .toFixed(2)}
                €
              </Text>
            </View>
          </View>
        </ScrollView>
        <KeyboardAvoidingViewWithoutWhitespace
          behavior="position"
          keyboardVerticalOffset={100}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              bottom: 0,
              padding: 5,
              width: '100%',
              alignItems: 'center',
              backgroundColor: 'black',
            }}>
            <View
              style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
              <AutocompleteDropdown
                clearOnFocus={false}
                closeOnBlur={true}
                closeOnSubmit={false}
                onSelectItem={setSelectedFlowType}
                dataSet={flowTypes}
                textInputProps={{
                  placeholder: 'Type',
                  placeholderTextColor: 'white',
                  autoCorrect: false,
                  autoCapitalize: 'none',
                  style: {
                    backgroundColor: '#383b42',
                    color: '#fff',
                    paddingLeft: 18,
                  },
                }}
                initialValue={flowTypes[0]} // or just '2'
                rightButtonsContainerStyle={{
                  right: 8,
                  height: 30,

                  alignSelf: 'center',
                }}
                inputContainerStyle={{
                  backgroundColor: '#383b42',
                  marginHorizontal: 2,
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
                clearOnFocus={false}
                closeOnBlur={true}
                closeOnSubmit={false}
                onChangeText={setSearchCategoriesText}
                onSelectItem={setSelectedCategory}
                dataSet={flowCategories}
                textInputProps={{
                  placeholder: 'Category',
                  placeholderTextColor: 'white',
                  autoCorrect: false,
                  autoCapitalize: 'none',
                  style: {
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
                  marginHorizontal: 2,
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
                style={{
                  flexGrow: 1,
                  backgroundColor: '#383b42',
                  color: 'white',
                  borderRadius: 5,
                  marginVertical: 2,
                  paddingHorizontal: 2,
                  textAlign: 'center',
                }}
                onChangeText={value => setCashAmount(value.replace(',', '.'))}
                value={cashAmount}
                placeholder="€"
                placeholderTextColor={'white'}
                inputMode="decimal"
              />
            </View>
            <TouchableOpacity
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 5,
                backgroundColor: '#383b42',
                borderRadius: 30,
                padding: 5,
              }}
              onPress={() => addFlow()}>
              <Icon name="plus" size={40} color={'white'}></Icon>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingViewWithoutWhitespace>
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
