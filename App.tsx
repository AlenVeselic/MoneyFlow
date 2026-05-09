/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  Modal,
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

import Icon from 'react-native-vector-icons/Feather';
import {KeyboardAvoidingViewWithoutWhitespace} from './components/KeyboardAvoidingView';

import RNFS from 'react-native-fs';
import DatePicker from 'react-native-date-picker';
/*

TODO:
- Balance
  - Balance widget
  - Balance changin g based on transactions
  - Balance setting
- Move inputs to modal
- Traverse dates
- All flows screen, grouped by date, with total sum for each date
- Export data as csv

*/

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() !== 'dark';

  const [flowTypes, setFlowTypes] = useState<any[]>([]);
  const [flowCategories, setFlowCategories] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [todaysFlows, setTodaysFlows] = useState<any[]>([]);

  const [searchCategoriesText, setSearchCategoriesText] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState<{title?: string}>(
    {},
  );
  const [cashAmount, setCashAmount] = useState('');
  const [selectedFlowType, setSelectedFlowType] = useState({});
  const [flowDate, setFlowDate] = useState<Date | null>(null);
  const [flowTime, setFlowTime] = useState<Date | null>(null);
  const [flowDescription, setFlowDescription] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showAddFlowModal, setShowAddFlowModal] = useState(false);

  const combineDateAndTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(time.getSeconds());
    return combined;
  };

  const onChangeFlowDate = (selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFlowDate(selectedDate);
    }
  };

  const onChangeFlowTime = (selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFlowTime(selectedTime);
    }
  };

  const [reloadInputOnSubmit, setReloadInputOnSubmit] = useState(false);

  const loadData = React.useCallback(async () => {
    // TODO: Initialize database, add communication with database
    const db = await connectToDatabase();
    // db.delete();
    try {
      await createTables(db);
      await seedTables(db);
      console.log(await getTableNames(db));
      setFlowTypes(await getFlowTypes(db));
      setFlowCategories(await getCategories(db));
      setFlows(await getFlows(db));
      setTodaysFlows(await getFlowsForToday(db));
    } catch (error) {
      console.error(error);
    } finally {
      db?.close();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // useEffect(() => {}, [flows]);
  // console.log('Flows:', flows);

  const addCategory = async (title: string) => {
    const db = await connectToDatabase();

    await createCategory(db, title);

    db.close();
    await refresh();
  };

  const addFlow = async () => {
    const db = await connectToDatabase();

    console.info('Selected category:', selectedCategory);
    console.info('Selected flow type:', selectedFlowType);
    let selectedCategoryTitle = selectedCategory?.title;

    if (!selectedCategoryTitle) {
      selectedCategoryTitle = searchCategoriesText;
    }
    if (!selectedCategoryTitle) {
      selectedCategoryTitle = 'Uncategorized';
    }

    const combinedDate =
      flowDate && flowTime
        ? combineDateAndTime(flowDate, flowTime)
        : flowDate || new Date();

    await createFlow(
      db,
      parseFloat(cashAmount),
      selectedCategoryTitle,
      selectedFlowType.id,
      flowDescription || undefined,
      combinedDate,
    );

    clearFlowInput();

    db.close();
    await refresh();
  };

  const clearFlowInput = () => {
    console.log('Clearing flow input');
    setReloadInputOnSubmit(true);
    setFlowCategories([]);
    setFlowTypes([]);
    setSearchCategoriesText('');
    setSelectedCategory({});
    setSelectedFlowType({});
    setCashAmount('');
    setFlowDate(null);
    setFlowTime(null);
    setFlowDescription(null);
    console.log('Cleared flow input');

    return;
  };

  useEffect(() => {
    if (reloadInputOnSubmit) {
      setTimeout(() => {
        setReloadInputOnSubmit(false);
      }, 100);
    }
  }, [reloadInputOnSubmit]);

  const refresh = async () => {
    const db = await connectToDatabase();

    console.log(await getTableNames(db));

    setFlowTypes(await getFlowTypes(db));
    setFlowCategories(await getCategories(db));
    setFlows(await getFlows(db));
    setTodaysFlows(await getFlowsForToday(db));

    console.log('Refreshed data');
    console.log('Flow types:', flowTypes);
    console.log('Flow categories:', flowCategories);
    console.log('Flows:', flows);
    console.log('Today flows:', todaysFlows);

    db.close();

    return;
  };

  const downloadBackup = () => {
    RNFS.copyFile(
      '/data/user/0/com.moneyflow/files/MoneyFlow.db',
      RNFS.DownloadDirectoryPath + '/' + 'MoneyFlowBackup.db',
    ).then(() => {
      console.log('successful');
    });
  };

  const wipeDatabase = async () => {
    const db = await connectToDatabase();
    await db.delete();
    db.close();
    await refresh();
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

              // backgroundColor: 'white',
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
                // backgroundColor: 'white',
              }}>
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
                onPress={() => downloadBackup()}>
                <Icon name="plus" size={40} color={'white'}>
                  Backup
                </Icon>
              </TouchableOpacity>
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
                onPress={() => wipeDatabase()}>
                <Icon name="plus" size={40} color={'white'}>
                  Wipe database
                </Icon>
              </TouchableOpacity>
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 20,
                  color: isDarkMode ? Colors.white : Colors.black,
                }}>
                {'<'} Today's transactions {'>'}
              </Text>
              {todaysFlows &&
                todaysFlows.length > 0 &&
                todaysFlows.map((flow, index) => (
                  <View key={index}>
                    <Text
                      key={index}
                      style={{
                        fontSize: 20,
                        color: isDarkMode ? Colors.white : Colors.black,
                      }}>
                      {new Date(flow.flowDate * 1000).toLocaleDateString()}{' '}
                      {new Date(flow.flowDate * 1000).toLocaleTimeString()} |{' '}
                      {flow.category} | {flow.flowtype == 'income' ? '+' : ''}
                      {flow.flowtype == 'expense' ? '-' : ''}
                      {flow.sum}€
                    </Text>
                  </View>
                ))}
              <Text
                style={{
                  fontSize: 20,
                  marginTop: 10,
                  color: isDarkMode ? Colors.white : Colors.black,
                }}>
                Total &nbsp;
                {todaysFlows
                  .reduce((prev, flow) => prev + parseFloat(flow.sum), 0)
                  .toFixed(2)}
                €
              </Text>
            </View>
          </View>
        </ScrollView>

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
          onPress={() => setShowAddFlowModal(true)}>
          <Icon name="clock" size={15} color={'white'}>
            {'Add flow'}
          </Icon>
        </TouchableOpacity>

        <Modal
          visible={showAddFlowModal}
          animationType="slide"
          transparent={false}
          style={{
            zIndex: 1,
            elevation: 1,
          }}
          onRequestClose={() => {
            setShowAddFlowModal(false);
          }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              height: (useWindowDimensions().height * 100) / 100,
            }}>
            <View
              style={{
                // display: 'flex',
                // flexDirection: 'column',
                // alignItems: 'center',
                // justifyContent: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: 'white',
              }}>
              {/* <KeyboardAvoidingViewWithoutWhitespace
                behavior="height"
                keyboardVerticalOffset={100}> */}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  // bottom: 0,
                  top: 150,
                  padding: 5,
                  width: '100%',
                  alignItems: 'center',
                  backgroundColor: 'black',
                }}>
                {!reloadInputOnSubmit && (
                  <AutocompleteDropdownContextProvider>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                      }}>
                      <AutocompleteDropdown
                        clearOnFocus={false}
                        closeOnBlur={true}
                        closeOnSubmit={false}
                        onSelectItem={item => setSelectedFlowType(item)}
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
                          <Text style={{color: '#fff', padding: 15}}>
                            {item.title}
                          </Text>
                        )}
                        inputHeight={50}
                        EmptyResultComponent={
                          <TouchableOpacity
                            style={{}}
                            onPress={() => addCategory(searchCategoriesText)}>
                            <Text
                              style={{color: 'white', height: 20, margin: 5}}>
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
                        onSelectItem={item => setSelectedCategory(item)}
                        dataSet={flowCategories}
                        onOpenSuggestionsList={() =>
                          console.log('Open suggestions')
                        }
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
                          <Text
                            style={{
                              color: '#fff',
                              padding: 15,
                            }}>
                            {item.title}
                          </Text>
                        )}
                        inputHeight={50}
                        EmptyResultComponent={
                          <TouchableOpacity
                            style={{}}
                            onPress={() => addCategory(searchCategoriesText)}>
                            <Text
                              style={{color: 'white', height: 20, margin: 5}}>
                              Add "{searchCategoriesText}"?
                            </Text>
                          </TouchableOpacity>
                        }
                      />
                      <TextInput
                        style={{
                          flexGrow: 2,
                          backgroundColor: '#383b42',
                          color: 'white',
                          borderRadius: 5,
                          marginVertical: 5,
                          marginHorizontal: 5,
                          paddingHorizontal: 0,
                          height: 50,
                          width: '90%',
                          textAlign: 'center',
                          alignSelf: 'center',
                          alignContent: 'center',
                        }}
                        onChangeText={value => setFlowDescription(value)}
                        value={flowDescription || ''}
                        placeholder="Enter optional description"
                        placeholderTextColor={'white'}
                        keyboardType="default"
                      />
                      <TextInput
                        style={{
                          flexGrow: 1,
                          backgroundColor: '#383b42',
                          color: 'white',
                          borderRadius: 5,
                          marginVertical: 6,
                          paddingHorizontal: 2,
                          height: 50,
                          width: '50%',
                          textAlign: 'center',
                          alignContent: 'center',
                          alignSelf: 'center',
                        }}
                        onChangeText={value =>
                          setCashAmount(value.replace(',', '.'))
                        }
                        value={cashAmount}
                        placeholder="€"
                        placeholderTextColor={'white'}
                        inputMode="decimal"
                      />
                    </View>
                  </AutocompleteDropdownContextProvider>
                )}
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
                  onPress={() => setShowDatePicker(true)}>
                  <Icon name="calendar" size={15} color={'white'}>
                    {flowDate ? flowDate.toDateString() : 'Transaction Date'}
                  </Icon>
                </TouchableOpacity>
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
                  onPress={() => setShowTimePicker(true)}>
                  <Icon name="clock" size={15} color={'white'}>
                    {flowTime ? flowTime.toTimeString() : ' Transaction Time'}
                  </Icon>
                </TouchableOpacity>
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
                  onPress={() => {
                    addFlow();
                    setShowAddFlowModal(false);
                  }}>
                  <Icon name="plus" size={40} color={'white'}></Icon>
                </TouchableOpacity>
                <Text>Modal content</Text>
              </View>
              {/* </KeyboardAvoidingViewWithoutWhitespace> */}
            </View>
          </ScrollView>
        </Modal>
        <DatePicker
          modal
          open={showDatePicker}
          date={flowDate || new Date()}
          mode="date"
          onConfirm={selectedDate => onChangeFlowDate(selectedDate)}
          onCancel={() => setShowDatePicker(false)}
        />

        <DatePicker
          modal
          open={showTimePicker}
          date={flowTime || new Date()}
          mode="time"
          onConfirm={selectedDate => onChangeFlowTime(selectedDate)}
          onCancel={() => setShowTimePicker(false)}
        />
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
