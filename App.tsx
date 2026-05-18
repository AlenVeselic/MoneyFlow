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
      // setFlows(await getFlows(db));
      setTodaysFlows(await getFlowsForToday(db));

      var tempFlows = await getFlows(db);
      var flowsGroupedByDate = tempFlows
        .sort((a: any, b: any) => b.flowDate - a.flowDate)
        .reduce((groups: any, flow: any) => {
          const date = new Date(flow.flowDate * 1000);
          const dateString = date.toLocaleDateString();

          if (!groups[dateString]) {
            groups[dateString] = [];
          }
          groups[dateString].push(flow);
          return groups;
        }, {});

      setFlows(flowsGroupedByDate);

      console.log('Grouped flows: ', flowsGroupedByDate);
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
      parseFloat(cashAmount) || 0,
      selectedCategoryTitle,
      selectedFlowType.id,
      flowDescription || '',
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
    // setFlows(await getFlows(db));
    setTodaysFlows(await getFlowsForToday(db));

    var tempFlows = await getFlows(db);
    var flowsGroupedByDate = tempFlows
      .sort((a: any, b: any) => b.flowDate - a.flowDate)
      .reduce((groups: any, flow: any) => {
        const date = new Date(flow.flowDate * 1000);
        const dateString = date.toLocaleDateString();

        if (!groups[dateString]) {
          groups[dateString] = [];
        }
        groups[dateString].push(flow);
        return groups;
      }, {});

    setFlows(flowsGroupedByDate);

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

  const backgroundColor = {
    backgroundColor: isDarkMode ? Colors.black : Colors.white,
  };

  const textColor = {color: isDarkMode ? Colors.white : Colors.black};

  const modalHeight = {height: (useWindowDimensions().height * 100) / 100};

  return (
    <SafeAreaView style={[backgroundStyle, styles.mainViewMinHeight]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={[backgroundColor, styles.headerContainer]}>
        <Text style={styles.headerText}>MoneyFlow</Text>
      </View>
      <View style={styles.utilityButtonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => downloadBackup()}>
          <Icon name="plus" size={16} color={'white'}>
            <Text style={styles.utilityButtonText}>Backup</Text>
          </Icon>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => wipeDatabase()}>
          <Icon name="plus" size={16} color={'white'}>
            <Text style={styles.utilityButtonText}>Wipe database</Text>
          </Icon>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowAddFlowModal(true)}>
        <Icon name="clock" size={20} color={'white'}>
          {'Add flow'}
        </Icon>
      </TouchableOpacity>
      <Modal
        visible={showAddFlowModal}
        animationType="slide"
        transparent={false}
        style={[styles.modal, modalHeight]}
        onRequestClose={() => {
          setShowAddFlowModal(false);
        }}>
        <View style={[styles.modalInnerContainer, modalHeight]}>
          {/* <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            height: (useWindowDimensions().height * 100) / 100,
            width: '100%',
          }}> */}
          <View style={styles.modalContextContainer}>
            {/* <KeyboardAvoidingViewWithoutWhitespace
                behavior="height"
                keyboardVerticalOffset={100}> */}
            <AutocompleteDropdownContextProvider>
              <View style={styles.modalOuterInputContainer}>
                {!reloadInputOnSubmit && (
                  <View style={styles.modalInnerInputContainer}>
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
                          textAlign: 'center',
                        },
                      }}
                      initialValue={flowTypes[0]} // or just '2'
                      rightButtonsContainerStyle={
                        styles.autocompleteDropdownRightButtonContainer
                      }
                      inputContainerStyle={
                        styles.autocompleteDropdownInputContainer
                      }
                      suggestionsListContainerStyle={
                        styles.autocompleteDropdownSuggestionsListContainer
                      }
                      renderItem={(item, text) => (
                        <Text style={styles.autocompleteDropdownRenderItemText}>
                          {item.title}
                        </Text>
                      )}
                      inputHeight={50}
                      EmptyResultComponent={
                        <TouchableOpacity
                          style={{}}
                          onPress={() => addCategory(searchCategoriesText)}>
                          <Text
                            style={
                              styles.autocompleteDropdownEmptyResultContainerText
                            }>
                            Add "{searchCategoriesText}"?
                          </Text>
                        </TouchableOpacity>
                      } // TODO: Add flow type adding functionality, this shouldn't add category
                    />
                    <AutocompleteDropdown
                      clearOnFocus={false}
                      closeOnBlur={true}
                      closeOnSubmit={false}
                      onChangeText={setSearchCategoriesText}
                      onSelectItem={item => setSelectedCategory(item)}
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
                          textAlign: 'center',
                        },
                      }}
                      initialValue={{id: '2'}} // or just '2'
                      rightButtonsContainerStyle={
                        styles.autocompleteDropdownRightButtonContainer
                      }
                      inputContainerStyle={
                        styles.autocompleteDropdownInputContainer
                      }
                      suggestionsListContainerStyle={
                        styles.autocompleteDropdownSuggestionsListContainer
                      }
                      renderItem={(item, text) => (
                        <Text style={styles.autocompleteDropdownRenderItemText}>
                          {item.title}
                        </Text>
                      )}
                      inputHeight={50}
                      EmptyResultComponent={
                        <TouchableOpacity
                          style={{}}
                          onPress={() => addCategory(searchCategoriesText)}>
                          <Text
                            style={
                              styles.autocompleteDropdownEmptyResultContainerText
                            }>
                            Add "{searchCategoriesText}"?
                          </Text>
                        </TouchableOpacity>
                      }
                    />
                    <TextInput
                      style={styles.descriptionTextInput}
                      onChangeText={value => setFlowDescription(value)}
                      value={flowDescription || ''}
                      placeholder="Enter optional description"
                      placeholderTextColor={'white'}
                      keyboardType="default"
                    />
                    <View style={styles.dateToggleButtonContainer}>
                      <TouchableOpacity
                        style={styles.showDatePickerButton}
                        onPress={() => setShowDatePicker(true)}>
                        <Icon name="calendar" size={15} color={'white'}>
                          {flowDate
                            ? flowDate.toDateString()
                            : 'Transaction Date'}
                        </Icon>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.showDatePickerButton}
                        onPress={() => setShowTimePicker(true)}>
                        <Icon name="clock" size={15} color={'white'}>
                          {flowTime
                            ? flowTime.toLocaleTimeString()
                            : ' Transaction Time'}
                        </Icon>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={styles.cashAmountDecimalInput}
                      onChangeText={value =>
                        setCashAmount(value.replace(',', '.'))
                      }
                      value={cashAmount}
                      placeholder="€"
                      placeholderTextColor={'white'}
                      inputMode="decimal"
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.addFlowButton}
                  onPress={() => {
                    addFlow();
                    setShowAddFlowModal(false);
                  }}>
                  <Icon name="plus" size={40} color={'white'} />
                </TouchableOpacity>
              </View>
            </AutocompleteDropdownContextProvider>
            {/* </KeyboardAvoidingViewWithoutWhitespace> */}
          </View>
        </View>
        {/* </ScrollView> */}
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

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={[styles.outerMainScrollViewContainer, backgroundColor]}>
          <View style={styles.innerMainScrollViewContainer}>
            <Text style={[styles.titleText, textColor]}>Transactions</Text>
            {flows &&
              Object.keys(flows).length > 0 &&
              Object.keys(flows).map((flowsDate: string, index) => (
                <View key={index} style={styles.flowsOuterContainer}>
                  <View style={styles.flowInnerContainer}>
                    <Text style={[styles.dateDividerText, textColor]}>
                      {flowsDate}
                    </Text>
                  </View>

                  <View style={styles.flowInnerContainer}>
                    {flows[flowsDate].map((flow: any, flowIndex: number) => (
                      <View key={flowIndex}>
                        <Text
                          key={flowIndex}
                          style={[styles.flowText, textColor]}>
                          {/* {new Date(
                              flow.flowDate * 1000,
                            ).toLocaleDateString()}{' '} */}
                          {new Date(flow.flowDate * 1000).toLocaleTimeString()}{' '}
                          | {flow.category} |{' '}
                          {flow.flowtype === 'income' ? '+' : ''}
                          {flow.flowtype === 'expense' ? '-' : ''}
                          {flow.sum}€
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* {new Date(flow.flowDate * 1000).toLocaleDateString()}{' '}
                      {new Date(flow.flowDate * 1000).toLocaleTimeString()} |{' '}
                      {flow.category} | {flow.flowtype == 'income' ? '+' : ''}
                      {flow.flowtype == 'expense' ? '-' : ''}
                      {flow.sum}€ */}
                  <Text style={[styles.flowText, textColor]}>
                    Total &nbsp;
                    {flows && flows[flowsDate] && flows[flowsDate].length > 0
                      ? flows[flowsDate]
                          .map((flow: any) => {
                            return (
                              parseFloat(flow.sum) *
                              (flow.flowtype === 'income' ? 1 : -1)
                            );
                          })
                          .reduce(
                            (prev: any, flow: any) => prev + parseFloat(flow),
                          )
                          .toFixed(2)
                      : '0.00'}
                    €
                    {/* .reduce((prev, flow) => prev + parseFloat(flow.sum), 0)
                  .toFixed(2)}
                € */}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainViewMinHeight: {minHeight: '50%'},
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
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  utilityButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',

    marginBottom: 10,
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    backgroundColor: '#383b42',
    borderRadius: 30,
    padding: 5,
  },
  utilityButtonText: {color: 'white', fontSize: 16},
  modal: {
    width: '100%',

    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalInnerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  modalContextContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
  },
  modalOuterInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    // bottom: 0,
    top: 150,
    padding: 2,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  modalInnerInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  autocompleteDropdownRightButtonContainer: {
    right: 8,
    height: 30,

    alignSelf: 'center',
  },
  autocompleteDropdownInputContainer: {
    backgroundColor: '#383b42',
    marginHorizontal: 20,
    width: '90%',
  },
  autocompleteDropdownSuggestionsListContainer: {
    backgroundColor: '#383b42',
  },
  autocompleteDropdownRenderItemText: {
    color: '#fff',
    padding: 15,
    textAlign: 'center',
  },
  autocompleteDropdownEmptyResultContainerText: {
    color: 'white',
    height: 20,
    margin: 5,
    textAlign: 'center',
  },
  descriptionTextInput: {
    flexGrow: 2,
    backgroundColor: '#383b42',
    color: 'white',
    borderRadius: 5,
    marginVertical: 2,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    height: 50,
    width: '90%',
    textAlign: 'center',
    alignSelf: 'center',
    alignContent: 'center',
  },
  dateToggleButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '90%',
    height: 50,
    marginHorizontal: 20,
    gap: 10,
  },
  showDatePickerButton: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    backgroundColor: '#383b42',
    borderRadius: 30,
    padding: 5,
  },
  cashAmountDecimalInput: {
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
  },
  addFlowButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    backgroundColor: '#383b42',
    borderRadius: 30,
    padding: 5,
  },
  outerMainScrollViewContainer: {
    // backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    //height: (useWindowDimensions().height * 80) / 100,
  },
  innerMainScrollViewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    // backgroundColor: 'white',
  },
  titleText: {
    marginTop: 5,
    fontSize: 20,
  },
  dateDividerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  flowsOuterContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  flowInnerContainer: {paddingLeft: 10},
  flowText: {
    fontSize: 20,
  },
});

export default App;
