import React from 'react';
import { mount, shallow } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import { rootReducer } from '../src/store/root';
import DiffPicker from '../src/components/DiffPickerDialog';



describe('DiffPicker', () => {
  it('DiffPicker component renders', () => {
    const wrapper = shallow(<DiffPicker />);
    expect(wrapper.exists()).toBe(true);
  });

  it('DiffDialog component is rendered when DiffPicker is clicked', () => {
    const store = createStore(rootReducer);
    const DiffPickerContext = wrapInTestContext(DiffPicker);
    const enzymeWrapper = mount(<Provider store={store}><DiffPickerContext /></Provider>);
    enzymeWrapper.find('#diffpicker-button').first().simulate('click');
    const diffPicker = enzymeWrapper.find(DiffPicker);
    expect(diffPicker.state('open')).toBeTruthy();
    expect(enzymeWrapper.find('#diffpicker-dialog').exists()).toBe(true);
  });

  it('DiffPicker allows selecting different active cards', () => {
    const store = createStore(rootReducer);
    const DiffPickerContext = wrapInTestContext(DiffPicker);
    const ref = React.createRef();
    const enzymeWrapper = mount(<Provider store={store}><DiffPickerContext ref={ref} /></Provider>);
    const picker = enzymeWrapper.find('#diffpicker-button').first();
    picker.simulate('click');
    expect(picker).toHaveBeenCalledTimes(1);
    // expect(picker.state().open);
  });
});