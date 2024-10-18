// import { apiEvents } from '@/services/cubing-pro/events/events';
// import { EventsAPI } from '@/services/cubing-pro/events/typings';
// import {
//   Button,
//   Form,
//   GetRef,
//   Input,
//   InputNumber,
//   InputRef,
//   Popconfirm,
//   Table,
//   TableProps,
// } from 'antd';
// import React, { useContext, useEffect, useRef, useState } from 'react';
//
//
// interface DataType {
//   key: React.Key;
//   eventId: string;
//   round: number;
//   qualify: number;
// }
//
// interface EditableRowProps {
//   index: number;
// }
//
// type FormInstance<T> = GetRef<typeof Form<T>>;
//
// interface EditableCellProps {
//   title: React.ReactNode;
//   editable: boolean;
//   dataIndex: keyof DataType;
//   record: DataType;
//   handleSave: (record: DataType) => void;
// }
//
// const EventTableForm: React.FC = () => {
//   const [events, setEvents] = useState<EventsAPI.Event[]>([]);
//   const [wcaEvents, setWcaEvents] = useState<string[]>([]);
//   const [compsEvents, setCompsEvents] = useState<string[]>([]);
//
//   const [dataSource, setDataSource] = useState<DataType[]>([
//     {
//       key: '333',
//       eventId: '333',
//       round: 1,
//     },
//   ]);
//
//   const [count, setCount] = useState(2);
//
//   useEffect(() => {
//     apiEvents().then((value) => {
//       setEvents(value.data.Events);
//       let wca = [];
//       let comp = [];
//       for (let i = 0; i < value.data.Events.length; i++) {
//         const ev = value.data.Events[i];
//         console.log(ev)
//         if (!ev.isComp) {
//           continue;
//         }
//         if (ev.isWCA) {
//           wca.push(ev.id);
//         } else {
//           comp.push(ev.id);
//         }
//       }
//       setWcaEvents(wca);
//       setCompsEvents(comp);
//       console.log(wcaEvents)
//       console.log(compsEvents)
//     });
//   }, []);
//
//
//   if (events.length === 0){
//     return <></>
//   }
//
//   const EditableContext = React.createContext<FormInstance<any> | null>(null);
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
//     const [form] = Form.useForm();
//     return (
//       <Form form={form} component={false}>
//         <EditableContext.Provider value={form}>
//           <tr {...props} />
//         </EditableContext.Provider>
//       </Form>
//     );
//   };
//
//   const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
//     title,
//     editable,
//     children,
//     dataIndex,
//     record,
//     handleSave,
//     ...restProps
//   }) => {
//     const [editing, setEditing] = useState(false);
//     const inputRef = useRef<InputRef>(null);
//     const form = useContext(EditableContext)!;
//
//     useEffect(() => {
//       if (editing) {
//         inputRef.current?.focus();
//       }
//     }, [editing]);
//
//     const toggleEdit = () => {
//       setEditing(!editing);
//       form.setFieldsValue({ [dataIndex]: record[dataIndex] });
//     };
//
//     const save = async () => {
//       try {
//         const values = await form.validateFields();
//         toggleEdit();
//         handleSave({ ...record, ...values });
//       } catch (errInfo) {
//         console.log('保存失败:', errInfo);
//       }
//     };
//
//     let childNode = children;
//
//     if (editable) {
//       childNode = editing ? (
//         <Form.Item
//           style={{ margin: 0 }}
//           name={dataIndex}
//           rules={[{ required: true, message: `${title} 是必填项` }]}
//         >
//           <Input ref={inputRef} onPressEnter={save} onBlur={save} />
//         </Form.Item>
//       ) : (
//         <div
//           className="editable-cell-value-wrap"
//           style={{ paddingInlineEnd: 24 }}
//           onClick={toggleEdit}
//         >
//           {children}
//         </div>
//       );
//     }
//
//     return <td {...restProps}>{childNode}</td>;
//   };
//
//   type ColumnTypes = Exclude<TableProps<DataType>['columns'], undefined>;
//
//
//
//   const handleDelete = (key: React.Key) => {
//     const newData = dataSource.filter((item) => item.key !== key);
//     setDataSource(newData);
//   };
//
//   const handleInputChange = (value: any, key: React.Key, dataIndex: string | number) => {
//     const newData = [...dataSource];
//     const index = newData.findIndex((item) => key === item.key);
//     if (index > -1) {
//       // @ts-ignore
//       newData[index][dataIndex] = value;
//       setDataSource(newData);
//     }
//   };
//
//   const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
//     {
//       title: '项目',
//       dataIndex: 'eventId',
//       editable: true,
//     },
//     {
//       title: '轮次',
//       dataIndex: 'round',
//       editable: true,
//       width: 100,
//       render: (_, record) => (
//         <InputNumber
//           min={1}
//           max={9}
//           defaultValue={record.round}
//           onChange={(value) => handleInputChange(value, record.key, 'round')}
//           style={{ width: '100%' }}
//         />
//       ),
//     },
//     {
//       title: '操作',
//       dataIndex: 'operation',
//       render: (_, record) =>
//         dataSource.length >= 1 ? (
//           <Popconfirm title="是否删除?" onConfirm={() => handleDelete(record.key)}>
//             <Button color="danger" size="small">
//               删除
//             </Button>
//           </Popconfirm>
//         ) : null,
//       width: 100,
//     },
//   ];
//
//   const addEvents = (evs: string[], all: boolean) => {
//     // 优先添加一个wca, 查找data 中没有的项目
//     const filter = evs.filter((value) => {
//       for (let i = 0; i < dataSource.length; i++) {
//         if (dataSource[i].eventId === value) {
//           return false;
//         }
//       }
//       return true;
//     });
//
//     console.log(evs, filter)
//     if (!filter || filter.length === 0) {
//       return false;
//     }
//
//     let newDatas = []
//     for (let i = 0; i < filter.length; i++){
//       const newData: DataType = {
//         key: filter[i],
//         eventId: filter[i],
//         round: 1,
//       };
//       newDatas.push(newData)
//       if (i === 0 && !all){
//         break
//       }
//     }
//
//     setDataSource([...dataSource, ...newDatas]);
//     setCount(count + newDatas.length);
//     return true;
//   };
//
//   const handleAdd = () => {
//     console.log(wcaEvents)
//     console.log(compsEvents)
//     if (addEvents(wcaEvents, false)) {
//       return;
//     }
//     addEvents(compsEvents, false);
//   };
//
//   const handleAddAllWca = () => {
//     addEvents(wcaEvents, true);
//   };
//
//   const handleSave = (row: DataType) => {
//     const newData = [...dataSource];
//     const index = newData.findIndex((item) => row.key === item.key);
//     const item = newData[index];
//     newData.splice(index, 1, {
//       ...item,
//       ...row,
//     });
//     setDataSource(newData);
//   };
//
//   const components = {
//     body: {
//       row: EditableRow,
//       cell: EditableCell,
//     },
//   };
//
//   const columns = defaultColumns.map((col) => {
//     if (!col.editable) {
//       return col;
//     }
//     return {
//       ...col,
//       onCell: (record: DataType) => ({
//         record,
//         editable: col.editable,
//         dataIndex: col.dataIndex,
//         title: col.title,
//         handleSave,
//       }),
//     };
//   });
//
//   return (
//     <div>
//       <Table<DataType>
//         components={components}
//         rowClassName={() => 'editable-row'}
//         bordered
//         dataSource={dataSource}
//         columns={columns as ColumnTypes}
//         pagination={false}
//         size={'small'}
//       />
//
//       <Button onClick={handleAdd} type="default" style={{ marginTop: 16, float: 'right' }}>
//         添加项目
//       </Button>
//       <Button
//         onClick={handleAddAllWca}
//         type="default"
//         style={{ marginTop: 16, marginRight: 5, float: 'right' }}
//       >
//         所有WCA项目
//       </Button>
//     </div>
//   );
// };
//
// export default EventTableForm;
